package com.hmdp.service.impl;

import com.hmdp.dto.UserDTO;
import com.hmdp.service.AdminAuthService;
import com.hmdp.utils.UserHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminAuthServiceImpl implements AdminAuthService {
    private final Set<Long> adminUserIds;

    public AdminAuthServiceImpl(@Value("${hmdp.admin.user-ids:1}") String adminUserIds) {
        this.adminUserIds = Arrays.stream(adminUserIds.split(","))
                .map(String::trim)
                .filter(id -> !id.isEmpty())
                .map(Long::valueOf)
                .collect(Collectors.toSet());
    }

    @Override
    public boolean isCurrentUserAdmin() {
        UserDTO user = UserHolder.getUser();
        return user != null && adminUserIds.contains(user.getId());
    }
}
