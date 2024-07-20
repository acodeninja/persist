.DEFAULT := help
.SHELL := bash

help:
	@echo "Persist developer tools"
	@echo
	@cat $(MAKEFILE_LIST) | grep -E '^[a-zA-Z_/-]+:.*?## .*$$' | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

commit/pre: lint

commit/message:
	commitlint --edit $(MESSAGE)

lint: ## Codebase style checks
	npm run lint

lint/fix: ## Codebase style fix
	npm run lint -- --fix
