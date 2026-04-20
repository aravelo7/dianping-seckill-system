package com.hmdp.interceptor;

import cn.hutool.core.util.StrUtil;
import com.hmdp.dto.UserDTO;
import com.hmdp.utils.JwtUtils;
import com.hmdp.utils.UserHolder;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class RefreshTokenInterceptor implements HandlerInterceptor {
    private final JwtUtils jwtUtils;

    public RefreshTokenInterceptor(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String authorization = request.getHeader("Authorization");
        if (StrUtil.isBlank(authorization)) {
            authorization = request.getHeader("authorization");
        }
        if (StrUtil.isBlank(authorization) || !authorization.startsWith("Bearer ")) {
            return true;
        }
        UserDTO userDTO = jwtUtils.parseToken(authorization.substring(7));
        if (userDTO != null) {
            UserHolder.saveUser(userDTO);
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        UserHolder.removeUser();
    }
}
