package com.hereforthevibes.backend;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class LoginService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    // Hash of a throwaway password, checked when the email doesn't exist. Hashing takes
    // a noticeable amount of time, so skipping it would let someone tell registered
    // emails apart from unregistered ones by how fast the login fails.
    private final String dummyHash;

    public LoginService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.dummyHash = passwordEncoder.encode("timing-equalizer-not-a-real-password");
    }

    /** Returns the user when the email and password match, otherwise empty. */
    public Optional<User> authenticate(LoginRequest request) {
        Optional<User> user = userRepository.findByEmail(request.email());
        String hash = user.map(User::getPasswordHash).orElse(dummyHash);
        boolean matches = passwordEncoder.matches(request.password(), hash);
        return matches ? user : Optional.empty();
    }
}
