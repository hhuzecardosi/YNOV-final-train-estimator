package org.katas

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class HelloTest {
    @Test
    fun `should work`() {
        assertEquals(3, 1 + 2)
    }

    @Test
    fun `should fail`() {
        assertEquals("Hello world!", Hello().sayHello())
    }
}