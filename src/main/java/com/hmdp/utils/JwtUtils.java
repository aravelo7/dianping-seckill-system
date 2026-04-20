package com.hmdp.utils;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.hmdp.dto.UserDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtUtils {
    private static final String HMAC_SHA256 = "HmacSHA256";

    @Value("${hmdp.jwt.secret}")
    private String secret;

    @Value("${hmdp.jwt.ttl}")
    private long ttlMillis;

    public String createToken(UserDTO user) {
        Map<String, Object> header = new HashMap<>();
        header.put("alg", "HS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new HashMap<>();
        payload.put("id", user.getId());
        payload.put("nickName", user.getNickName());
        payload.put("icon", user.getIcon());
        payload.put("exp", System.currentTimeMillis() + ttlMillis);

        String headerPart = base64Url(JSONUtil.toJsonStr(header));
        String payloadPart = base64Url(JSONUtil.toJsonStr(payload));
        String content = headerPart + "." + payloadPart;
        return content + "." + sign(content);
    }

    public UserDTO parseToken(String token) {
        try {
            if (StrUtil.isBlank(token)) {
                return null;
            }
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }
            String content = parts[0] + "." + parts[1];
            if (!sign(content).equals(parts[2])) {
                return null;
            }

            JSONObject payload = JSONUtil.parseObj(new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8));
            Long exp = payload.getLong("exp");
            if (exp == null || exp < System.currentTimeMillis()) {
                return null;
            }

            UserDTO user = new UserDTO();
            user.setId(payload.getLong("id"));
            user.setNickName(payload.getStr("nickName"));
            user.setIcon(payload.getStr("icon"));
            return user;
        } catch (Exception e) {
            return null;
        }
    }

    private String base64Url(String source) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(source.getBytes(StandardCharsets.UTF_8));
    }

    private String sign(String content) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("JWT sign failed", e);
        }
    }
}
