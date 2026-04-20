#!/usr/bin/env node

const { execFileSync } = require('child_process');

const config = {
  mode: 'check',
  mysqlContainer: 'dianping-mysql',
  redisContainer: 'dianping-redis',
  mysqlUser: 'root',
  mysqlPassword: '123456',
  database: 'hm_dianping',
};

for (const arg of process.argv.slice(2)) {
  const [key, value] = arg.replace(/^--/, '').split('=');
  if (key && value !== undefined && key in config) {
    config[key] = value;
  }
}

if (!['check', 'repair'].includes(config.mode)) {
  console.error('Invalid --mode. Use --mode=check or --mode=repair.');
  process.exit(1);
}

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function mysqlQuery(sql) {
  return run('docker', [
    'exec',
    config.mysqlContainer,
    'mysql',
    `-u${config.mysqlUser}`,
    `-p${config.mysqlPassword}`,
    '-N',
    '-B',
    config.database,
    '-e',
    sql,
  ]);
}

function redis(args) {
  return run('docker', ['exec', config.redisContainer, 'redis-cli', ...args]);
}

function parseSeckillRows(output) {
  if (!output) {
    return [];
  }
  return output.split(/\r?\n/).filter(Boolean).map((line) => {
    const [voucherId, stock] = line.split(/\t/);
    return { voucherId: String(voucherId), mysqlStock: String(stock) };
  });
}

function parseOrphanKeys(output, mysqlVoucherIds) {
  if (!output) {
    return [];
  }
  return output.split(/\r?\n/)
    .filter(Boolean)
    .map((key) => {
      const voucherId = key.replace(/^seckill:stock:/, '');
      return { key, voucherId };
    })
    .filter((item) => !mysqlVoucherIds.has(item.voucherId));
}

function isInteger(value) {
  return /^-?\d+$/.test(String(value));
}

function main() {
  const rows = parseSeckillRows(
    mysqlQuery('select voucher_id, stock from tb_seckill_voucher order by voucher_id;')
  );
  const mysqlVoucherIds = new Set(rows.map((row) => row.voucherId));

  const records = rows.map((row) => {
    const redisKey = `seckill:stock:${row.voucherId}`;
    const redisValue = redis(['GET', redisKey]);
    let status = 'OK';
    if (!redisValue) {
      status = 'MISSING';
    } else if (!isInteger(redisValue)) {
      status = 'INVALID';
    } else if (String(Number(redisValue)) !== String(Number(row.mysqlStock))) {
      status = 'MISMATCH';
    }
    return { ...row, redisKey, redisValue: redisValue || 'nil', status };
  });

  const orphanKeys = parseOrphanKeys(redis(['KEYS', 'seckill:stock:*']), mysqlVoucherIds)
    .map((item) => ({
      voucherId: item.voucherId,
      mysqlStock: 'nil',
      redisKey: item.key,
      redisValue: redis(['GET', item.key]) || 'nil',
      status: 'ORPHAN',
    }));

  const all = [...records, ...orphanKeys];
  const counts = {
    OK: records.filter((item) => item.status === 'OK').length,
    MISSING: records.filter((item) => item.status === 'MISSING').length,
    INVALID: records.filter((item) => item.status === 'INVALID').length,
    MISMATCH: records.filter((item) => item.status === 'MISMATCH').length,
    ORPHAN: orphanKeys.length,
  };

  console.log(`mode=${config.mode}`);
  console.log(`totalSeckillVouchers=${rows.length}`);
  console.log(`OK=${counts.OK}`);
  console.log(`MISSING=${counts.MISSING}`);
  console.log(`INVALID=${counts.INVALID}`);
  console.log(`MISMATCH=${counts.MISMATCH}`);
  console.log(`ORPHAN=${counts.ORPHAN}`);

  const abnormal = all.filter((item) => item.status !== 'OK');
  if (abnormal.length === 0) {
    console.log('abnormalRecords=none');
  } else {
    console.log('abnormalRecords:');
    abnormal.forEach((item) => {
      console.log(
        `voucherId=${item.voucherId}, mysqlStock=${item.mysqlStock}, redisKey=${item.redisKey}, redisValue=${item.redisValue}, status=${item.status}`
      );
    });
  }

  if (config.mode === 'repair') {
    const repairable = records.filter((item) => ['MISSING', 'INVALID', 'MISMATCH'].includes(item.status));
    if (repairable.length === 0) {
      console.log('repairActions=none');
    } else {
      console.log('repairActions:');
      repairable.forEach((item) => {
        redis(['SET', item.redisKey, item.mysqlStock]);
        console.log(`repaired ${item.redisKey} -> ${item.mysqlStock}`);
      });
    }

    const after = records.map((item) => {
      const value = redis(['GET', item.redisKey]);
      const status = value && isInteger(value) && Number(value) === Number(item.mysqlStock) ? 'OK' : 'NOT_OK';
      return { ...item, redisValue: value || 'nil', status };
    });
    console.log('afterRepair:');
    console.log(`OK=${after.filter((item) => item.status === 'OK').length}`);
    after.filter((item) => item.status !== 'OK').forEach((item) => {
      console.log(
        `voucherId=${item.voucherId}, mysqlStock=${item.mysqlStock}, redisKey=${item.redisKey}, redisValue=${item.redisValue}, status=${item.status}`
      );
    });
    if (orphanKeys.length > 0) {
      console.log('orphan keys are reported only and were not deleted.');
    }
  }
}

try {
  main();
} catch (error) {
  console.error('seckill stock check failed.');
  console.error(error.stderr || error.message || error);
  process.exit(1);
}
