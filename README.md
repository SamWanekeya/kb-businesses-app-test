# [Kakbima Platform](https://accounts.kakbima.dev) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://support.atlassian.com/bitbucket-cloud/docs/clone-and-make-a-change-on-a-new-branch/)

###### A digital insurance manager that tracks all insurance and micro-insurance policies, claims and premiums, simplify access to insurance information digitally, anywhere, anytime

---

## Technology Stack

- [Laravel](https://laravel.com/docs/13.x) 13.x
- [React](https://react.dev/learn) 19.x and [Vite](https://vite.dev/guide/) 8.x (Frontend build system)
- [MariaDB](https://mariadb.com/docs) 12.x (Relational database management system)
- [Composer](https://getcomposer.org/doc/) 2.x (Dependency management)
- [Artisan](https://laravel.com/docs/12.x/artisan) 12.x (Command-line interface)
- [Node.js](https://nodejs.org/docs/latest-v24.x/api/index.html/) 24.x and [yarn](https://classic.yarnpkg.com/lang/en/docs/) 1.x (Frontend dependencies and build)

---

## Setup Instructions

### Local Installation

1. Clone the repository:

    ```bash
    git clone https://bitbucket.org/kernelponies/kb-businesses-and-admin-webapp/src/main kakbima-business-admin-webapp
    ```

2. Install backend and frontend dependencies:

    ```bash
    composer install
    yarn install
    ```

3. Copy and configure the environment file:

    ```bash
    cp .env.example .env
    ```

4. Generate the application key:

    ```bash
    php artisan key:generate
    ```

5. Run database migrations and seeders manually:

    ```bash
    php artisan migrate
    php artisan db:seed
    ```

6. Start the development servers:

    ```bash
    php artisan serve
    yarn run dev
    ```

---

## Default Users

After running the seeders or completing installation via the Web Installer, you can log in using:

- **Super Administrator**
    - Email: `super_admin@kakbima.dev`
    - Password: `Kakbima@DemoAccount2026`

- **Organization Administrator**
    - Email: `organization@kakbima.dev`
    - Password: `Kakbima@DemoAccount2026`

---

## Optional Commands and Helpers

### IDE Helper Commands (For PhpStorm Users)

1. Generate Eloquent helper:

    ```bash
    php artisan ide-helper:eloquent
    ```

2. Generate IDE helper files:

    ```bash
    php artisan ide-helper:generate
    ```

3. Generate PhpStorm metadata:

    ```bash
    php artisan ide-helper:meta
    ```

4. Generate model autocompletion:

    ```bash
    php artisan ide-helper:models
    ```

---

## Production Deployment

1. Clone the repository:

    ```bash
    git clone https://bitbucket.org/kernelponies/kb-businesses-and-admin-webapp/src/main kakbima-business-admin-webapp
    ```

2. Create a MariaDB database:

    ```bash
    mysql -u root -p
    create database kakbima;
    \q
    ```

3. Copy and configure the environment file:

    ```bash
    cp .env.example .env
    ```

4. Install optimized dependencies:

    ```bash
    composer install --optimize-autoloader --no-dev
    yarn install && yarn run build
    ```

5. Optimize and deploy:

    ```bash
    php artisan migrate --force
    php artisan db:seed --force
    php artisan route:cache
    php artisan config:cache
    php artisan view:cache
    php artisan storage:link
    ```

6. Ensure `public/storage` is writable:

    ```bash
    chmod -R 775 public/storage
    ```

---

## Backend (PHP + Laravel) Commands

1. Rebuild configuration cache:

```bash
php artisan config:cache
```

2. Reset Spatie permissions cache:

```bash
php artisan permission:cache-reset
```

3. Automatically fix PHP Coding Standards issues:

```bash
vendor/bin/php-cs-fixer fix --config=.php-cs-fixer.dist.php
```

---

## Frontend (Inertia + React) Commands

1. Start the Vite development server with hot module replacement (HMR):

```bash
yarn dev
```

2. Build the frontend assets for production:

```bash
yarn build
```

3. Build both client and server bundles (SSR):

```bash
yarn build:ssr
```

---

## Code Quality & Formatting

1. Format frontend source files using Prettier:

```bash
yarn format
```

2. Check formatting without making changes:

```bash
yarn format:check
```

3. Lint and automatically fix ESLint issues:

```bash
yarn lint
```

---

## Type Checking

1. Run TypeScript type checks without emitting files:

```bash
yarn types
```

---

## Frontend Architectural Principles

1. **Keep pages dumb** – Pages only compose hooks, components, and layouts.
2. **Centralize logic in hooks** – Reusable logic lives under `/hooks`.
3. **Use `/lib` for utilities** – Non-React helpers (validation, etc.).
4. **Isolate UI components** – Components are presentation-only.
5. **Keep layouts separate** – Layouts define structure, navigation, and context.
6. **Type everything** – Define shared interfaces in `/types`.
7. **Avoid barrel imports completely** – They can significantly degrade application performance by bloating project bundle and slowing down development tools.
8. **Capitalize React files and folders** – Matches React’s component naming convention.
9. **Use camelCase for hooks and functions** – Matches React’s “useSomething” pattern.
10. **Avoid cross-dependencies** – Layouts shouldn’t import pages, hooks shouldn’t import layouts.

---
