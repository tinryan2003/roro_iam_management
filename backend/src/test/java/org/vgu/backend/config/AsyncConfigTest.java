package org.vgu.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.test.context.ActiveProfiles;

/**
 * Test class to verify async configuration and bean injection
 */
@SpringBootTest
@ActiveProfiles("test")
public class AsyncConfigTest {

    @Autowired
    @Qualifier("taskExecutor")
    private ThreadPoolTaskExecutor taskExecutor;

    @Autowired
    @Qualifier("notificationExecutor")
    private ThreadPoolTaskExecutor notificationExecutor;

    @Autowired
    @Qualifier("emailExecutor")
    private ThreadPoolTaskExecutor emailExecutor;

    @Test
    public void testTaskExecutorBeanInjection() {
        assertNotNull(taskExecutor, "taskExecutor bean should be injected");
        assertNotNull(taskExecutor.getThreadPoolExecutor(), "ThreadPoolExecutor should be initialized");
    }

    @Test
    public void testNotificationExecutorBeanInjection() {
        assertNotNull(notificationExecutor, "notificationExecutor bean should be injected");
        assertNotNull(notificationExecutor.getThreadPoolExecutor(), "ThreadPoolExecutor should be initialized");
    }

    @Test
    public void testEmailExecutorBeanInjection() {
        assertNotNull(emailExecutor, "emailExecutor bean should be injected");
        assertNotNull(emailExecutor.getThreadPoolExecutor(), "ThreadPoolExecutor should be initialized");
    }

    @Test
    public void testThreadPoolConfiguration() {
        // Test main executor configuration
        assertEquals(4, taskExecutor.getCorePoolSize());
        assertEquals(8, taskExecutor.getMaxPoolSize());

        // Test notification executor configuration
        assertEquals(2, notificationExecutor.getCorePoolSize());
        assertEquals(4, notificationExecutor.getMaxPoolSize());

        // Test email executor configuration
        assertEquals(2, emailExecutor.getCorePoolSize());
        assertEquals(4, emailExecutor.getMaxPoolSize());
    }
}
