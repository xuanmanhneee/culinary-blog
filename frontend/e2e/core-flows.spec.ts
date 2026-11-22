import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * 5 luồng cốt lõi theo SRS (NFR-MAINT): đăng ký, đăng nhập, tạo công thức, xuất bản, tìm kiếm.
 * Chạy tuần tự trên cùng một tài khoản/công thức mới tạo cho mỗi lần chạy.
 */
const MAILHOG = process.env.E2E_MAILHOG_URL ?? "http://localhost:8025";
const run = Date.now().toString(36);
const account = {
  fullName: `Tác giả E2E ${run}`,
  userName: `e2e${run}`,
  email: `e2e-${run}@example.com`,
  password: "Abcd@1234",
};
const authFile = "e2e/.auth/author.json";
const recipe = { title: `Món kiểm thử ${run}`, slug: `mon-kiem-thu-${run}`, keyword: `kiemthu${run}` };

/** Lấy link xác nhận email mới nhất gửi tới địa chỉ này từ Mailhog (đúng như người dùng bấm trong hộp thư). */
async function confirmationLink(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const response = await fetch(`${MAILHOG}/api/v2/search?kind=to&query=${encodeURIComponent(email)}`);
    const data = (await response.json()) as { items: { Content: { Body: string } }[] };
    for (const item of data.items) {
      const body = item.Content.Body;
      const html = /^[A-Za-z0-9+/=\s]+$/.test(body) ? Buffer.from(body, "base64").toString("utf8") : body;
      const match = /href="([^"]*\/confirm-email\?[^"]+)"/.exec(html);
      if (match) return match[1].replace(/&amp;/g, "&");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Không thấy email xác nhận gửi tới ${email}`);
}

async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(account.email);
  await page.locator('input[name="password"]').fill(account.password);
  await page.getByRole("button", { name: /^Đăng nhập/ }).first().click();
  // Chờ phiên được thiết lập xong rồi mới điều hướng tiếp, tránh ngắt giữa chừng quá trình đăng nhập.
  await expect(page).not.toHaveURL(/\/login/);
}

/** Mở trang đã đăng nhập từ phiên lưu ở bước 2, để không đăng nhập lại (auth giới hạn 10 request/phút/IP). */
async function authedPage(browser: Browser) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, storageState: authFile });
  return { context, page: await context.newPage() };
}

test.describe.configure({ mode: "serial" });

test("1. đăng ký tài khoản mới", async ({ page }) => {
  await page.goto("/register");
  await page.locator('input[name="fullName"]').fill(account.fullName);
  await page.locator('input[name="userName"]').fill(account.userName);
  await page.locator('input[name="email"]').fill(account.email);
  await page.locator('input[name="password"]').fill(account.password);
  await page.locator('input[name="confirmPassword"]').fill(account.password);
  await page.getByRole("button", { name: "Đăng ký" }).click();

  // Đăng ký xong tự đăng nhập: rời khỏi trang đăng ký.
  await expect(page).not.toHaveURL(/\/register/);
});

test("2. xác nhận email rồi đăng nhập", async ({ page }) => {
  await page.goto(await confirmationLink(account.email));
  await expect(page.getByRole("heading", { name: "Email đã được xác nhận" })).toBeVisible();

  await login(page);
  await expect(page).not.toHaveURL(/\/login/);
  await page.context().storageState({ path: authFile });
  await page.goto("/account");
  await expect(page.getByText(account.userName).first()).toBeVisible();
});

test("2b. đăng nhập sai mật khẩu bị từ chối", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(account.email);
  await page.locator('input[name="password"]').fill("Sai@1234567");
  await page.getByRole("button", { name: /^Đăng nhập/ }).first().click();
  await expect(page.getByText("Email hoặc mật khẩu không đúng.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("3. tạo công thức qua wizard (lưu bản nháp)", async ({ browser }) => {
  const { context, page } = await authedPage(browser);
  await page.goto("/dashboard/recipes/new");

  await page.locator("#title").fill(recipe.title);
  await page.locator("#description").fill(`Công thức dùng cho kiểm thử E2E ${recipe.keyword}.`);
  await page.locator("#categoryId").selectOption({ index: 1 });
  await page.locator("#prepTimeMinutes").fill("10");
  await page.locator("#cookTimeMinutes").fill("20");
  await page.getByRole("button", { name: /Tiếp theo/ }).click();

  await page.getByRole("button", { name: "Thêm nguyên liệu" }).first().click();
  await page.getByPlaceholder("Ví dụ: Thịt bò").first().fill("Thịt bò");
  await page.getByPlaceholder("g, ml, muỗng...").first().fill("g");
  await page.getByRole("button", { name: /Tiếp theo/ }).click();

  await page.getByRole("button", { name: "Thêm bước" }).first().click();
  await page.getByPlaceholder("Mô tả chi tiết thao tác...").first().fill("Nấu nước dùng trong hai giờ.");
  await page.getByRole("button", { name: /Tiếp theo/ }).click();

  await page.getByRole("button", { name: /Lưu bản nháp/ }).click();
  // Chuyển về danh sách kèm notice=created nghĩa là API đã tạo công thức thành công.
  await expect(page).toHaveURL(/notice=created/);
  await context.close();
});

test("4. xuất bản công thức rồi xem công khai", async ({ browser }) => {
  const { context, page } = await authedPage(browser);
  await page.goto("/dashboard/recipes");
  await page.getByRole("button", { name: `Thao tác khác với "${recipe.title}"` }).first().click();
  await page.getByRole("menuitem", { name: "Xuất bản", exact: true }).click();
  await expect(page.getByText("Đã xuất bản").first()).toBeVisible();
  await context.close();

  // Khách (chưa đăng nhập) giờ xem được trang chi tiết. Dùng trang chi tiết thay vì danh sách vì
  // danh sách công khai được cache vài chục giây nên có thể chưa hiện món vừa xuất bản.
  const guest = await browser.newContext({ ignoreHTTPSErrors: true });
  const guestPage = await guest.newPage();
  await guestPage.goto(`/recipes/${recipe.slug}`);
  await expect(guestPage.getByRole("heading", { name: recipe.title })).toBeVisible();
  await guest.close();
});

test("5. tìm kiếm thấy công thức đã xuất bản", async ({ page }) => {
  await page.goto("/search");
  await page.locator("#recipe-search").fill(recipe.keyword);
  await page.keyboard.press("Enter");
  await expect(page.getByText(recipe.title).first()).toBeVisible();
  await expect(page.getByText(/Tìm thấy [1-9]\d* công thức/)).toBeVisible();
});
