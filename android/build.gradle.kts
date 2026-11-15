// Top-level build file. Plugins are declared here and applied in app/build.gradle.kts.
plugins {
    alias(libs.plugins.android.application) apply false
    // Pins the Kotlin Gradle Plugin version used by AGP's built-in Kotlin support.
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.google.services) apply false
}
