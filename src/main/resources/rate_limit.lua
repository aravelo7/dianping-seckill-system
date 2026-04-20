local key = KEYS[1]
local limit = tonumber(ARGV[1])
local windowSeconds = tonumber(ARGV[2])

local current = tonumber(redis.call('get', key) or '0')
if current >= limit then
    return 0
end

current = redis.call('incr', key)
if current == 1 then
    redis.call('expire', key, windowSeconds)
end

if current > limit then
    return 0
end
return 1
