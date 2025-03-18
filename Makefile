.PHONY: test-integration start-docker test-clean

COMPOSE=docker compose
COMPOSE_INTEGRATION_FILE=docker-compose.integration.yml

test-integration:
	$(COMPOSE) -f $(COMPOSE_INTEGRATION_FILE) up -d
	yarn test:integration $(ARGS)
	test-clean

test-clean:
	$(COMPOSE) -f $(COMPOSE_INTEGRATION_FILE) down --volumes