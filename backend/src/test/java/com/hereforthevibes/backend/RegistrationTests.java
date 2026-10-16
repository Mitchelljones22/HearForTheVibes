package com.hereforthevibes.backend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:sqlite:target/registration-tests.db",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.open-in-view=false"
})
@AutoConfigureMockMvc
@ExtendWith(OutputCaptureExtension.class)
class RegistrationTests {
    private static final String PASSWORD = "RegistrationTest123!";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder passwordEncoder;

    @BeforeEach
    void clearTestDatabase() {
        users.deleteAll();
    }

    @Test
    void createsUserWithNormalizedFieldsAndHashedPassword(CapturedOutput output) throws Exception {
        var request = validRequest();
        request.put("firstName", " Jane ");
        request.put("lastName", " Doe ");
        request.put("email", " JANE@Example.com ");
        request.put("phone", "(816) 555-0123");

        String body = submit(request).andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.message").value("Account created successfully."))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        User saved = users.findByEmail("jane@example.com").orElseThrow();
        assertThat(saved.getFirstName()).isEqualTo("Jane");
        assertThat(saved.getLastName()).isEqualTo("Doe");
        assertThat(saved.getPhoneNumber()).isEqualTo("8165550123");
        assertThat(saved.getPasswordHash()).startsWith("{pbkdf2-sha256-600000}").isNotEqualTo(PASSWORD);
        assertThat(passwordEncoder.matches(PASSWORD, saved.getPasswordHash())).isTrue();
        assertThat(passwordEncoder.matches("WrongPassword123!", saved.getPasswordHash())).isFalse();
        assertThat(body).doesNotContain(PASSWORD, saved.getPasswordHash());
        assertThat(mapper.writeValueAsString(saved)).doesNotContain("passwordHash", saved.getPasswordHash());
        assertThat(output.getAll()).doesNotContain(PASSWORD);
    }

    @ParameterizedTest
    @ValueSource(strings = {"firstName", "lastName", "email", "phone", "password"})
    void rejectsMissingFields(String field) throws Exception {
        var request = validRequest();
        request.remove(field);
        submit(request).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors." + field).isString());
        assertThat(users.count()).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"firstName", "lastName", "email", "phone", "password"})
    void rejectsBlankFields(String field) throws Exception {
        var request = validRequest();
        request.put(field, "   ");
        submit(request).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors." + field).isString());
        assertThat(users.count()).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"Ab1!", "lowercase123!", "UPPERCASE123!", "NoNumbersHere!", "NoSpecial123"})
    void enforcesEveryPasswordRule(String password, CapturedOutput output) throws Exception {
        var request = validRequest();
        request.put("password", password);
        String response = submit(request).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").isString())
                .andReturn().getResponse().getContentAsString();
        assertThat(response).doesNotContain(password);
        assertThat(output.getAll()).doesNotContain(password);
        assertThat(users.count()).isZero();
    }

    @Test
    void rejectsExcessivePasswordLength() throws Exception {
        var request = validRequest();
        request.put("password", "Aa1!" + "x".repeat(1021));
        submit(request).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.password").isString());
        assertThat(users.count()).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"invalid", "jane@example", "jane @example.com", "jane@example.c"})
    void rejectsInvalidEmail(String email) throws Exception {
        var request = validRequest();
        request.put("email", email);
        submit(request).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.email").isString());
        assertThat(users.count()).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"123", "18165550123", "816555012x", "abcdefghij"})
    void rejectsInvalidPhone(String phone) throws Exception {
        var request = validRequest();
        request.put("phone", phone);
        submit(request).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.phone").isString());
        assertThat(users.count()).isZero();
    }

    @Test
    void rejectsDuplicateEmailRegardlessOfCaseOrSpaces() throws Exception {
        submit(validRequest()).andExpect(status().isCreated());
        var duplicate = validRequest();
        duplicate.put("email", " JANE@EXAMPLE.COM ");
        duplicate.put("phone", "8165550124");
        submit(duplicate).andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors.email").value("Email already registered."));
        assertThat(users.count()).isEqualTo(1);
    }

    @Test
    void rejectsDuplicatePhoneRegardlessOfFormatting() throws Exception {
        submit(validRequest()).andExpect(status().isCreated());
        var duplicate = validRequest();
        duplicate.put("email", "another@example.com");
        duplicate.put("phone", "(816) 555-0123");
        submit(duplicate).andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors.phone").value("Phone number already registered."));
        assertThat(users.count()).isEqualTo(1);
    }

    @Test
    void reportsBothDuplicates() throws Exception {
        submit(validRequest()).andExpect(status().isCreated());
        submit(validRequest()).andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors.email").isString())
                .andExpect(jsonPath("$.errors.phone").isString());
        assertThat(users.count()).isEqualTo(1);
    }

    @Test
    void preservesLongPasswordsAndSpacesAndUsesUniqueSalts() throws Exception {
        String password = " " + PASSWORD + "x".repeat(80) + " ";
        var first = validRequest();
        first.put("password", password);
        submit(first).andExpect(status().isCreated());
        var second = new LinkedHashMap<>(first);
        second.put("email", "second@example.com");
        second.put("phone", "8165550124");
        submit(second).andExpect(status().isCreated());
        String firstHash = users.findByEmail("jane@example.com").orElseThrow().getPasswordHash();
        String secondHash = users.findByEmail("second@example.com").orElseThrow().getPasswordHash();
        assertThat(firstHash).isNotEqualTo(secondHash);
        assertThat(passwordEncoder.matches(password, firstHash)).isTrue();
        assertThat(passwordEncoder.matches(password.strip(), firstHash)).isFalse();
    }

    @Test
    void malformedRequestsDoNotExposeOrLogPassword(CapturedOutput output) throws Exception {
        String malformed = "{\"password\":\"" + PASSWORD + "\",\"email\":";
        String response = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(malformed))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.form").isString())
                .andReturn().getResponse().getContentAsString();
        assertThat(response).doesNotContain(PASSWORD);
        assertThat(output.getAll()).doesNotContain(PASSWORD);
        assertThat(users.count()).isZero();
    }

    @Test
    void emptyBodyReturnsSafeError() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.form").isString());
    }

    @Test
    void requestCannotExposePasswordThroughToStringOrJson() {
        var request = new RegisterRequest("Jane", "Doe", "jane@example.com", "8165550123", PASSWORD);
        assertThat(request.toString()).doesNotContain(PASSWORD);
        assertThat(mapper.writeValueAsString(request)).doesNotContain(PASSWORD, "password");
    }

    private Map<String, String> validRequest() {
        return new LinkedHashMap<>(Map.of("firstName", "Jane", "lastName", "Doe",
                "email", "jane@example.com", "phone", "8165550123", "password", PASSWORD));
    }

    private ResultActions submit(Map<String, String> request) throws Exception {
        return mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(request)));
    }
}
