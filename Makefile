.DEFAULT := help
.SHELL := bash

help:
	@echo "Persist developer tools"
	@echo
	@cat $(MAKEFILE_LIST) | grep -E '^[a-zA-Z_/-]+:.*?## .*$$' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

.PHONY: commit/pre
commit/pre: lint test/coverage

.PHONY: commit/message
commit/message:
	commitlint --edit $(MESSAGE)

init: node_modules ## Initialise dependencies

.PHONY: lint
lint: ## Codebase style checks
	npm run lint

.PHONY: lint/fix
lint/fix: ## Codebase style fix
	npm run lint -- --fix

.PHONY: test
test:
	npm test

.PHONY: test/watch
test/watch:
	npm run test:watch

.PHONY: test/coverage
test/coverage:
	npm run test:coverage

node_modules:
	npm install
