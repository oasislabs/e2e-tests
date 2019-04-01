IMG_ORG ?= oasislabs
IMG_VER ?= latest

.PHONY: e2e-tests

e2e-tests: Dockerfile
	docker build . -t $(IMG_ORG)/$@:$(IMG_VER)
