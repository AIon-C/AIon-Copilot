package infra

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"github.com/redis/go-redis/v9"
)

type redisPubSub struct {
	rdb *redis.Client
}

func NewRedisPubSub(rdb *redis.Client) domain.EventBus {
	return &redisPubSub{rdb: rdb}
}

func (ps *redisPubSub) Publish(ctx context.Context, channelID string, event *domain.Event) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}
	topic := "ws:channel:" + channelID
	return ps.rdb.Publish(ctx, topic, data).Err()
}

func (ps *redisPubSub) Subscribe(ctx context.Context, channelID string) (<-chan *domain.Event, func(), error) {
	topic := "ws:channel:" + channelID
	sub := ps.rdb.Subscribe(ctx, topic)

	// Wait for subscription confirmation
	if _, err := sub.Receive(ctx); err != nil {
		sub.Close()
		return nil, nil, fmt.Errorf("subscribe: %w", err)
	}

	ch := make(chan *domain.Event, 64)

	go func() {
		defer close(ch)
		for msg := range sub.Channel() {
			var event domain.Event
			if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
				continue
			}
			select {
			case ch <- &event:
			default:
				// Drop if consumer is too slow
			}
		}
	}()

	unsubscribe := func() {
		sub.Close()
	}

	return ch, unsubscribe, nil
}
