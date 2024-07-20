.DEFAULT := help
.SHELL := bash

help:
	@echo "Persist developer tools"

commit/message:
	commitlint --edit $(MESSAGE)
