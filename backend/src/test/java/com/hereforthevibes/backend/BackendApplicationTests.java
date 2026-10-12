package com.hereforthevibes.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:sqlite:target/context-tests.db",
		"spring.jpa.hibernate.ddl-auto=create-drop"
})
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
