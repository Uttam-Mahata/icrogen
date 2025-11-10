package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisCache wraps the Redis client with caching utilities
type RedisCache struct {
	client *redis.Client
}

// NewRedisCache creates a new Redis cache instance
func NewRedisCache(redisURL string) (*RedisCache, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(opts)

	// Test connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, err
	}

	return &RedisCache{
		client: client,
	}, nil
}

// Get retrieves a value from cache and unmarshals it into the target
func (r *RedisCache) Get(ctx context.Context, key string, target interface{}) error {
	val, err := r.client.Get(ctx, key).Result()
	if err != nil {
		return err
	}

	return json.Unmarshal([]byte(val), target)
}

// Set stores a value in cache with the specified TTL
func (r *RedisCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return r.client.Set(ctx, key, data, ttl).Err()
}

// Delete removes a key from cache
func (r *RedisCache) Delete(ctx context.Context, key string) error {
	return r.client.Del(ctx, key).Err()
}

// DeletePattern removes all keys matching a pattern
func (r *RedisCache) DeletePattern(ctx context.Context, pattern string) error {
	var cursor uint64
	for {
		var keys []string
		var err error
		keys, cursor, err = r.client.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			return err
		}

		if len(keys) > 0 {
			if err := r.client.Del(ctx, keys...).Err(); err != nil {
				return err
			}
		}

		if cursor == 0 {
			break
		}
	}
	return nil
}

// Exists checks if a key exists in cache
func (r *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	result, err := r.client.Exists(ctx, key).Result()
	return result > 0, err
}

// Close closes the Redis connection
func (r *RedisCache) Close() error {
	return r.client.Close()
}

// GetOrSet retrieves a value from cache, or sets it if not found
func (r *RedisCache) GetOrSet(ctx context.Context, key string, target interface{}, ttl time.Duration, fetchFn func() (interface{}, error)) error {
	// Try to get from cache
	err := r.Get(ctx, key, target)
	if err == nil {
		return nil
	}

	// If not in cache (or error), fetch the value
	if err == redis.Nil || err != nil {
		value, fetchErr := fetchFn()
		if fetchErr != nil {
			return fetchErr
		}

		// Store in cache
		if setErr := r.Set(ctx, key, value, ttl); setErr != nil {
			// Log error but don't fail
			// The value is still returned even if caching fails
		}

		// Marshal to target
		data, marshalErr := json.Marshal(value)
		if marshalErr != nil {
			return marshalErr
		}

		return json.Unmarshal(data, target)
	}

	return err
}
