import { test, expect } from '@playwright/test';

// We can run the same test flow for multiple roles using a  loop
const rolesToTest = ['Customer', 'Manager'];

for (const role of rolesToTest) {
  test(`Authentication Flow - ${role}`, async ({ page }) => {
    //  Generate random data for this specific test run
    const timestamp = Date.now();
    const email = `testuser_${timestamp}@example.com`;
    const password = 'Password123!';
    const firstName = 'Test';
    const lastName = 'User';

    // 1. Open webpage
    await page.goto('http://localhost:3002/');

    // 2. Click register
    await page.click('button:has-text("Register")');

    // Wait for the modal to be visible
    await expect(page.locator('.modal__title')).toHaveText('Create New Account');

    // 3. Fill in random data
    await page.fill('#register-first-name', firstName);
    await page.fill('#register-last-name', lastName);
    await page.fill('#register-email', email);
    await page.fill('#register-password', password);
    await page.fill('#register-confirm-password', password);

    // Select the current role in the loop
    await page.selectOption('#register-role', role);

    // Check terms and conditions
    await page.check('#terms-checkbox');

    //  Register
    await page.click('button#register-submit');

    // Wait for the user menu trigger to appear (indicates successful login)
    await page.waitForSelector('#user-menu-trigger');

    //  Click on profile to check role and if logged in
    await page.click('#user-menu-trigger');
    
    // Check that the displayed role matches the role we registered with
    const displayedRole = await page.textContent('.user-menu__role');
    expect(displayedRole.trim().toUpperCase()).toBe(role.toUpperCase());

    // Logout
    await page.click('button#btn-logout');

    // Verify logout by ensuring the Sign In button is visible again
    await expect(page.locator('button#btn-signin')).toBeVisible();

    // Login
    await page.click('button#btn-signin');

    // Wait for the modal to be visible
    await expect(page.locator('.modal__title')).toHaveText('Sign In to Your Account');

    // Fill the same data
    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    await page.click('button#login-submit');

    // Wait for login to complete
    await page.waitForSelector('#user-menu-trigger');

    // Check profile for role and if logged in again
    await page.click('#user-menu-trigger');
    
    const loginDisplayedRole = await page.textContent('.user-menu__role');
    expect(loginDisplayedRole.trim().toUpperCase()).toBe(role.toUpperCase());
  });
}
