.PHONY: test-integration start-docker test-clean

COMPOSE=docker compose
COMPOSE_FILE=docker-compose.yml
COMPOSE_INTEGRATION_FILE=docker-compose.integration.yml

dev-setup:
	yarn install
	yarn run migrate

run: 
	$(COMPOSE) -f $(COMPOSE_FILE) up --build

stop:
	$(COMPOSE) -f $(COMPOSE_FILE) down

stop-clear:
	$(COMPOSE) -f $(COMPOSE_FILE) down --volumes

test-unit: 
	yarn run test:unit

test-integration:
	$(COMPOSE) -f $(COMPOSE_INTEGRATION_FILE) up -d
	yarn test:integration $(ARGS)

test-clean:
	$(COMPOSE) -f $(COMPOSE_INTEGRATION_FILE) down --volumes