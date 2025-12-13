// .eslintrc.cjs
module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true,
        webextensions: true, // browser extension globals (chrome, browser, etc.)
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
        // If you later want rules that need type info, add:
        // project: "./tsconfig.json"
    },
    plugins: [
        "@typescript-eslint",
        "import"
        // "react" // uncomment if you actually use React in this project
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/recommended",
        "plugin:import/typescript"
        // "plugin:react/recommended",          // if React
        // "plugin:react/jsx-runtime"           // if React with new JSX transform
    ],
    settings: {
        "import/resolver": {
            typescript: {
                // use your tsconfig paths if you have them
                project: "./tsconfig.json"
            }
        }
        // If using React:
        // react: {
        //   version: "detect"
        // }
    },
    ignorePatterns: [
        "dist/",
        "build/",
        "node_modules/",
        "webpack.config.js"
    ],
    rules: {
        // General JS / TS tweaks
        "no-unused-vars": "off", // handled by TS version
        "@typescript-eslint/no-unused-vars": [
            "warn",
            {
                argsIgnorePattern: "^_",
                varsIgnorePattern: "^_",
                caughtErrorsIgnorePattern: "^_"
            }
        ],
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/explicit-function-return-type": "off",

        // Imports: keep things tidy but not insane
        "import/order": [
            "warn",
            {
                "groups": [
                    "builtin",
                    "external",
                    "internal",
                    "parent",
                    "sibling",
                    "index",
                    "object",
                    "type"
                ],
                "newlines-between": "always",
                "alphabetize": {order: "asc", caseInsensitive: true}
            }
        ],
        "import/no-unresolved": "error",
        "import/no-duplicates": "warn"
    }
};
