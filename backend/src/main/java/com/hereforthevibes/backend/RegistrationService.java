package com.hereforthevibes.backend;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class RegistrationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Long register(RegisterRequest request) {
        rejectDuplicates(request);
        User user = new User(request.firstName(), request.lastName(), request.email(),
                passwordEncoder.encode(request.password()), request.phone());
        try {
            return userRepository.saveAndFlush(user).getId();
        } catch (DataIntegrityViolationException exception) {
            // A competing request may have saved the same email or phone after our check.
            // The repository transaction has rolled back before we query again.
            rejectDuplicates(request);
            throw exception;
        }
    }

    private void rejectDuplicates(RegisterRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            errors.put("email", "Email already registered.");
        }
        if (userRepository.existsByPhoneNumber(request.phone())) {
            errors.put("phone", "Phone number already registered.");
        }
        if (!errors.isEmpty()) {
            throw new RegistrationConflictException(errors);
        }
    }
}
