const { test, describe, expect, beforeEach } = require('@playwright/test')
const { loginWith, createBlog } = require('./helper')

describe('Blogs app', () => {
    beforeEach(async ({ page, request }) => {
        await request.post('/api/testing/reset')
        await request.post('/api/users', {
            data: {
                name: 'Pete Testeri',
                username: 'testeriPete',
                password: 'salainen'
            }
        })
        await request.post('/api/users', {
            data: {
                name: 'Kimi Testeri',
                username: 'testeriKimi',
                password: 'salanen'
            }
        })
        await page.goto('/')
      })

    test('front page can be opened', async ({ page }) => {
        const locator = await page.getByText('Log in to application')
        await expect(locator).toBeVisible()
        await expect(page.getByText('Log in to application')).toBeVisible()
        })

    test('login fails with wrong password', async ({ page }) => {
        await page.getByTestId('username').fill('mluukkai')
        await page.getByTestId('password').fill('wrong')
        await page.getByRole('button', { name: 'login' }).click()
    
        await expect(page.getByText('wrong username or password')).toBeVisible()
        })    

    test('user can log in', async ({ page }) => {
        await loginWith(page,'testeriPete', 'salainen')
        await expect(page.getByText('Pete Testeri logged in')).toBeVisible()
      })
    
    describe('when logged in...', () => {
        beforeEach(async ({ page }) => {
            await loginWith(page,'testeriPete', 'salainen')
        })
     

        test('a new blog can be created', async ({ page }) => {
            await createBlog(page, { title: 'A new test blog', author: 'created by playwright', url: 'http://blogByPlayWright.com'}, true)
            await expect(page.getByText('A new test blog').last()).toBeVisible()
        })

        describe('and couple blogs exists', () => {
            beforeEach(async ({ page }) => {
              await createBlog(page, { title: 'First test blog', author: 'created by playwright', url: 'http://blogByPlayWright.com'}, true)
              await createBlog(page, { title: 'Second test blog', author: 'created by playwright', url: 'http://blogByPlayWright.com'}, true)
              await createBlog(page, { title: 'Third test blog', author: 'created by playwright', url: 'http://blogByPlayWright.com'}, true)
              await page.reload({waitUntil:'load'})
            })
        
            test('like can be clicked', async ({ page }) => {
              const secondBlog = await page.getByText('second test blog')
              await secondBlog.getByRole('button', { name: 'view' }).click()
              const secondBlogElem = await secondBlog.locator('..')
              await secondBlogElem.getByRole('button', { name: 'like' }).click()
              await expect(secondBlogElem.getByText('1')).toBeVisible()
            })

            test('liked blog is first', async ({ page }) => {
                const secondBlog = await page.getByText('second test blog')
                await secondBlog.getByRole('button', { name: 'view' }).click()
                const secondBlogElem = await secondBlog.locator('..')
                await secondBlogElem.getByRole('button', { name: 'like' }).click()
                await expect(page.getByPlaceholder('blogTitle').first()).toHaveText(/Second test blog/)
            })

            test('user can delete own blogpost', async ({ page }) => {
                const secondBlog = await page.getByText('second test blog')
                await secondBlog.getByRole('button', { name: 'view' }).click()
                const secondBlogElem = await secondBlog.locator('..')
                page.on('dialog', async dialog => {
                    await dialog.accept()
                });
                await secondBlogElem.getByRole('button', { name: 'delete' }).click()
                await expect(secondBlog).not.toBeVisible()
            })

            test('only blog creator can see the delete button', async ({ page }) => {
                const secondBlog = await page.getByText('second test blog')
                await secondBlog.getByRole('button', { name: 'view' }).click()
                const secondBlogElem = await secondBlog.locator('..')
                await expect(secondBlogElem.getByRole('button', { name: 'delete' })).toBeVisible()

                await page.getByRole('button', { name : 'Logout' }).click()
                await loginWith(page,'testeriKimi', 'salanen')

                const againSecondBlog = await page.getByText('second test blog')
                await againSecondBlog.getByRole('button', { name: 'view' }).click()
                const againSecondBlogElem = await againSecondBlog.locator('..')
                await expect(againSecondBlogElem.getByRole('button', { name: 'delete' })).not.toBeVisible()

            })
        })    
    })     
})