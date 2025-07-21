# Contributing to Alvara Smart Contracts

Thank you for considering contributing to the Alvara smart contracts! We appreciate your effort to improve our platform. This document outlines the contribution process, coding standards, and best practices to follow when contributing to the project.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Coding Standards](#coding-standards)
4. [Security Best Practices](#security-best-practices)
5. [Testing](#testing)
6. [Pull Request Process](#pull-request-process)
7. [Reporting Issues](#reporting-issues)
8. [Community](#community)

## Getting Started

Before you begin contributing, ensure you have the following installed:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Hardhat](https://hardhat.org/)
- [Solidity](https://soliditylang.org/)
- [Git](https://git-scm.com/)

To set up the project:

1. **Fork the Repository**: Click on the "Fork" button at the top right of the repository to create your copy of the project.
2. **Clone the Repository**: Clone your forked repository to your local machine.
   ```bash
        git clone https://github.com/Alvara-Protocol/alvara-contracts.git
        cd Alvara
   ```
3. **Install Dependencies**: Run the following command to install all necessary dependencies. 
   ```bash
        npm install
   ```
4. **Set Up Environment Variables**: Create a .env file based on the .env.example file and configure the environment variables as needed.


## Development Workflow
To contribute, follow this workflow:

1. **Create a Branch**: Create a new branch from the main branch for your feature or bug fix.
   ```bash
        git checkout -b feature/your-feature-name
   ```

2. **Write Code**: mplement your feature or fix following the Coding Standards outlined below.

3. **Run Tests**: Ensure that your changes pass all tests by running:
   ```bash
        npx hard test
   ```
   or want to run specific test file

   ```bash
        npx hard test --grep WETH
   ```

4. **Commit Changes**: Commit your changes with a clear and concise commit message.
   ```bash
        git commit -m "Add feature XYZ"
   ```
5. **Push to GitHub**: Push your branch to GitHub.
   ```bash
        git push origin feature/your-feature-name
   ```
6. **Create a Pull Request**: Open a pull request (PR) to the main branch of the main repository and request a review.


## Contribution Guidelines
We value all contributions and encourage community members to share improvements, bug fixes, and enhancements. Please make sure to:

1. **Understand the Project**: Familiarize yourself with the project's architecture and design principles before contributing.
2. **Follow the Guidelines**: Adhere to the coding standards and best practices outlined in this document.
3. **Document Your Changes**: Update relevant documentation, including README files, contract documentation, and code comments, to reflect any changes you make.
4. **Be Respectful**: Maintain a respectful and professional tone when interacting with the community, whether in issues, pull requests, or discussions.
5. **Engage with the Community**: Participate in discussions, attend community meetings, and contribute to the project's ongoing development and improvement.

By following these guidelines, you help ensure that Alvara remains a high-quality, well-maintained project that serves its users effectively.


## Coding Standards
When contributing, please adhere to the following coding standards:

1. **Solidity Style Guide**: Follow the official [Solidity Style Guide](https://docs.soliditylang.org/en/v0.8.20/style-guide.html).
2. **Code Comments**: Comment your code where necessary, especially for complex logic.
3. **Naming Conventions**: Use clear and descriptive names for variables, functions, and contracts.
4. **Use of Libraries**: Prefer using established libraries like OpenZeppelin for standard contracts and functionality.
5. **Gas Optimization**: Be mindful of gas costs and optimize where necessary.


## Security Best Practices
Security is paramount when dealing with smart contracts. Follow these best practices:

1. **Use SafeMath**: Ensure safe arithmetic operations by using SafeMath or Solidity's built-in overflow checks (`>=0.8.0`).
2. **Minimize External Calls**: Avoid unnecessary external contract calls and always handle potential failures.
3. **Reentrancy Guard**: Use the `nonReentrant` modifier to prevent reentrancy attacks in your contracts.
4. **Access Control**: Ensure only authorized entities can perform sensitive operations using access control patterns like `Ownable` or `RBAC`.
5. **Upgradability**: When creating upgradeable contracts, follow the proxy pattern and consider the implications on storage.


## Testing
Testing is crucial to ensure the reliability of smart contracts. Here’s how to test your contributions:

1. **Unit Tests**: Write unit tests for all new features or bug fixes.
2. **Test Coverage**: Aim for 100% test coverage by writing tests for all paths, including edge cases.
3. **Testing Framework**: Use Hardhat's built-in testing capabilities or a similar framework like Truffle or Mocha.
4. **Run Tests**: Run tests using:
   ```bash
   npx hardhat test
   ```
5. **Unit Test sheet**: Create a unit-test sheet which include all the tests that you have write and share that document with Team, so they can verify the test with sheet and check weather it is passed or not.


## Pull Request Process
1. **Ensure Linting**: Make sure your code passes linting checks.
2. **Provide a Description**: Describe the changes in your PR with a clear explanation of the problem and solution.
3. **Reviewers**: Request a review from at least one maintainer or team member.
4. **Address Feedback**: Be open to feedback and make the necessary changes to your PR.


## Reporting Issues
If you encounter a bug or have a feature request, please [open an issue](https://github.com/Alvara-Protocol/alvara-contracts/issues). Provide as much detail as possible, including steps to reproduce the issue if applicable.


## Community
Join the Alvara community to stay updated and get support:

- **Telegram**: [Join our Telegram channel](https://t.me/alvaraprotocol)
- **Twitter**: [Follow us on Twitter](https://twitter.com/alvaraprotocol)

We look forward to your contributions!