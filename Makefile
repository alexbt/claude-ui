.PHONY: install dev build start clean

# install dependencies
install:
	npm install

# launch the app in development mode (hot reload) — http://localhost:3000
dev:
	npm run dev

# production build
build:
	npm run build

# launch the production build (run `make build` first)
start:
	npm run start

# remove build artifacts
clean:
	rm -rf .next tsconfig.tsbuildinfo
