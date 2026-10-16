package com.hereforthevibes.backend;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RegistrationServiceTests {
    @ParameterizedTest
    @ValueSource(strings = {"email", "phone"})
    void translatesDuplicateCreatedBetweenCheckAndSave(String field) {
        UserRepository repository = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        var request = new RegisterRequest("Jane", "Doe", "jane@example.com", "8165550123", "Test123!");
        when(encoder.encode(request.password())).thenReturn("encoded-password");
        when(repository.existsByEmailIgnoreCase(request.email())).thenReturn(false, field.equals("email"));
        when(repository.existsByPhoneNumber(request.phone())).thenReturn(false, field.equals("phone"));
        when(repository.saveAndFlush(any(User.class))).thenThrow(new DataIntegrityViolationException("unique"));

        assertThatThrownBy(() -> new RegistrationService(repository, encoder).register(request))
                .isInstanceOfSatisfying(RegistrationConflictException.class,
                        exception -> org.assertj.core.api.Assertions.assertThat(exception.getErrors()).containsKey(field));
    }
}
