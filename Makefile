.DEFAULT := help
.SHELL := bash

help:
	@echo "Persist developer tools"
	@echo
	@cat $(MAKEFILE_LIST) | grep -E '^[a-zA-Z_/-]+:.*?## .*$$' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

commit/pre: lint test

commit/message:
	commitlint --edit $(MESSAGE)

init: node_modules ## Initialise dependencies

lint: ## Codebase style checks
	npm run lint

lint/fix: ## Codebase style fix
	npm run lint -- --fix

.PHONY: test
test:
	npm test

test/watch:
	npm run test:watch

test/coverage:
	npm run test:coverage

test/coverage/report:
	npm run test:coverage:report

node_modules:
	npm install
