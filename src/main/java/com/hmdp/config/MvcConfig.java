package com.hmdp.config;

import com.hmdp.interceptor.LoginInterceptor;
import com.hmdp.interceptor.RefreshTokenInterceptor;
import com.hmdp.utils.JwtUtils;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import javax.annotation.Resource;

@Configuration
public class MvcConfig implements WebMvcConfigurer {
    @Resource
    private JwtUtils jwtUtils;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LoginInterceptor())
                .excludePathPatterns(
                        "/user/login",
                        "/upload/**",
                        "/voucher/**",
                        "/user/code",
                        "/shop/**",
                        "/shop-type/**",
                        "/blog/hot",
                        "/admin/cache-monitor.html"
                ).order(1);

        registry.addInterceptor(new RefreshTokenInterceptor(jwtUtils))
                .addPathPatterns("/**").order(0);
    }
}
