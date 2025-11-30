package com.livestream.service;

import com.livestream.entity.User;
import com.livestream.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(String username, String password, String email) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }
        
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
            .username(username)
            .password(passwordEncoder.encode(password))
            .email(email)
            .streamKey(generateStreamKey())
            .role(User.Role.ADMIN)
            .isActive(true)
            .build();

        User savedUser = userRepository.save(user);
        log.info("User registered: username={}, id={}", username, savedUser.getId());
        
        return savedUser;
    }

    @Transactional(readOnly = true)
    public Optional<User> authenticateUser(String username, String password) {
        return userRepository.findByUsername(username)
            .filter(user -> passwordEncoder.matches(password, user.getPassword()))
            .filter(User::getIsActive);
    }

    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional(readOnly = true)
    public Optional<User> findByStreamKey(String streamKey) {
        return userRepository.findByStreamKey(streamKey);
    }

    @Transactional
    public String regenerateStreamKey(Long userId) {
        return userRepository.findById(userId)
            .map(user -> {
                String newStreamKey = generateStreamKey();
                user.setStreamKey(newStreamKey);
                userRepository.save(user);
                log.info("Stream key regenerated for user: id={}", userId);
                return newStreamKey;
            })
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Invalid old password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed for user: id={}", userId);
    }

    @Transactional
    public void deactivateUser(Long userId) {
        userRepository.findById(userId)
            .ifPresent(user -> {
                user.setIsActive(false);
                userRepository.save(user);
                log.info("User deactivated: id={}", userId);
            });
    }

    private String generateStreamKey() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
