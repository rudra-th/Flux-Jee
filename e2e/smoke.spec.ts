import { test, expect, type Page } from '@playwright/test'

/** Answer whatever question type is currently on screen. */
async function answerCurrentQuestion(page: Page) {
  const numeric = page.locator('input[aria-label="Numeric answer input"]')
  if (await numeric.isVisible().catch(() => false)) {
    await numeric.fill('42')
    return
  }
  const matrixBtn = page.locator('main table button').first()
  if (await matrixBtn.isVisible().catch(() => false)) {
    await matrixBtn.click()
    return
  }
  const option = page.locator('main button[role="option"]').first()
  await option.click()
}

/** Wait for the app shell + home page (bootstrap must have completed). */
async function waitForHome(page: Page) {
  await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible({ timeout: 150_000 })
}

test('first boot provisions the question bank and renders home', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto('/')

  // Seeding 1900+ questions takes a while; wait for the real home page.
  await waitForHome(page)
  await expect(page).toHaveURL(/\/$/)

  // Daily challenge only reports "Questions ready" when questions exist.
  await expect(page.getByText('Questions ready', { exact: true })).toBeVisible({ timeout: 60_000 })

  expect(pageErrors).toEqual([])
})

test('every page and mode route renders (no 404 bounce)', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto('/')
  await waitForHome(page)

  const heading = async (name: string | RegExp) =>
    expect(page.getByRole('heading', { name })).toBeVisible()

  const pages: Array<[string, string | RegExp]> = [
    ['/analytics', 'Analytics'],
    ['/mistakes', 'Mistake Notebook'],
    ['/bookmarks', 'Bookmarks'],
    ['/flashcards', 'Flashcards'],
    ['/formulas', 'Formula Sheets'],
    ['/search', 'Question Search'],
    ['/question-bank', 'Question Search'],
    ['/leaderboard', 'Leaderboard'],
    ['/settings', 'Settings'],
    ['/practice', 'Practice'],
    ['/test', 'Test Builder'],
    ['/test/custom', 'Test Builder'],
    ['/test/full', 'Test Builder'],
    ['/test/chapter', 'Test Builder'],
    ['/test/subject', 'Test Builder'],
    ['/test/topic', 'Test Builder'],
    ['/practice/mixed', 'Test Builder'],
    ['/practice/daily', 'Test Builder'],
    ['/practice/marathon', 'Test Builder'],
    ['/practice/speed', 'Test Builder'],
    ['/practice/revision', 'Test Builder'],
    ['/practice/pyq', 'Test Builder'],
    ['/practice/adaptive', 'Test Builder'],
    ['/practice/weak', 'Test Builder'],
    ['/practice/wrong', 'Mistake Notebook'],
    ['/practice/bookmarked', 'Bookmarks'],
  ]

  for (const [path, name] of pages) {
    await page.goto(path)
    await heading(name)
  }

  // Weak-chapter deep link should pre-select the chapter.
  await page.goto('/test/chapter?subject=physics&chapter=Units%20and%20Measurements')
  await heading('Test Builder')
  await page.getByRole('tab', { name: 'Chapters' }).click()
  await expect(page.getByText('1 selected')).toBeVisible()

  // Sidebar buttons navigate (Question Bank + Leaderboard routes).
  await page.goto('/')
  await waitForHome(page)
  await page.getByRole('link', { name: 'Question Bank' }).click()
  await heading('Question Search')
  await page.getByRole('link', { name: 'Leaderboard' }).click()
  await heading('Leaderboard')

  // Home hero buttons.
  await page.goto('/')
  await waitForHome(page)
  await page.getByRole('button', { name: 'Start Full Test' }).click()
  await expect(page).toHaveURL(/\/test\/full/)
  await page.goto('/')
  await waitForHome(page)
  await page.getByRole('button', { name: 'Daily Challenge', exact: true }).click()
  await expect(page).toHaveURL(/\/practice\/daily/)
  await page.goto('/')
  await waitForHome(page)
  await page.getByRole('button', { name: 'Adaptive Mode', exact: true }).click()
  await expect(page).toHaveURL(/\/practice\/adaptive/)

  expect(pageErrors).toEqual([])
})

test('full test round trip: build, run, answer, submit, result', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto('/test/full')
  await expect(page.getByRole('heading', { name: 'Test Builder' })).toBeVisible({ timeout: 150_000 })
  await expect(page).toHaveURL(/\/test\/full/)

  await page.getByRole('button', { name: 'Start Test' }).click()
  await page.waitForURL(/\/run\//)

  // Instructions screen.
  await page.locator('#agree').check()
  await page.getByRole('button', { name: 'Start Test' }).click()

  // Answer first question, advance to second.
  await expect(page.getByText('Question 1 /')).toBeVisible()
  await answerCurrentQuestion(page)
  await page.getByRole('button', { name: 'Save & Next' }).click()
  await expect(page.getByText('Question 2 /')).toBeVisible()

  // Submit via the dialog.
  await page.getByRole('button', { name: 'Submit', exact: true }).click()
  await page.getByRole('button', { name: 'Submit Test' }).click()
  await page.waitForURL(/\/result\//)
  await expect(page.getByRole('heading', { name: /Question Test/ })).toBeVisible({ timeout: 30_000 })

  expect(pageErrors).toEqual([])
})

test('search finds questions after seeding', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto('/')
  await waitForHome(page)

  await page.goto('/search')
  await expect(page.getByRole('heading', { name: 'Question Search' })).toBeVisible()

  const input = page.getByPlaceholder('Search by topic, formula, concept…')
  await input.fill('Newton')
  await input.press('Enter')

  const counter = page.getByText(/\d+ results/)
  await expect(counter).toBeVisible()
  const count = parseInt((await counter.textContent()) ?? '0', 10)
  expect(count).toBeGreaterThan(0)

  expect(pageErrors).toEqual([])
})
