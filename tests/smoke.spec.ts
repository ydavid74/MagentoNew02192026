import { test, expect } from '@playwright/test'

test.describe('Jewelry Management System - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
  })

  test('should load orders page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Orders')
    await expect(page.locator('[data-testid="orders-table"]')).toBeVisible()
  })

  test('should navigate to import page', async ({ page }) => {
    await page.click('text=Import')
    await expect(page.locator('h1')).toContainText('Import Orders')
    await expect(page.locator('text=Upload CSV Files')).toBeVisible()
  })

  test('should show diamonds page for admin users', async ({ page }) => {
    await page.click('text=Diamonds')
    await expect(page.locator('h1')).toContainText('Diamonds')
  })

  test('should allow CSV file upload', async ({ page }) => {
    await page.goto('/import')
    
    // Test file upload button exists
    await expect(page.locator('text=Select File').first()).toBeVisible()
    
    // Test sample download buttons
    await expect(page.locator('text=customers.csv')).toBeVisible()
    await expect(page.locator('text=orders.csv')).toBeVisible()
  })

  test('should show dry run and execute buttons', async ({ page }) => {
    await page.goto('/import')
    
    await expect(page.locator('text=Dry Run')).toBeVisible()
    await expect(page.locator('text=Execute Import')).toBeVisible()
  })
})