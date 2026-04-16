import { chromium, FullConfig } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'https://customer-rma.vercel.app'

async function loginAndSave(
  email: string,
  password: string,
  statePath: string,
  expectedUrl: string
) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(`${BASE}/login`)
  await page.getByLabel('Email address').first().fill(email)
  await page.getByLabel('Password').first().fill(password)
  await page.getByRole('button', { name: 'Sign In' }).last().click()
  await page.waitForURL(expectedUrl, { timeout: 20000 })

  await context.storageState({ path: statePath })
  await browser.close()
}

async function globalSetup(_config: FullConfig) {
  await loginAndSave(
    'demo.admin@cosworth.com',
    'Demo1234!',
    'playwright/.auth/admin.json',
    `${BASE}/admin/dashboard`
  )
  await loginAndSave(
    'demo.staff@cosworth.com',
    'Demo1234!',
    'playwright/.auth/staff-uk.json',
    `${BASE}/admin/dashboard`
  )
  await loginAndSave(
    'demo.customer@btsport.com',
    'Demo1234!',
    'playwright/.auth/customer.json',
    `${BASE}/cases`
  )
}

export default globalSetup
