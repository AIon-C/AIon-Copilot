package infra

import (
	"database/sql"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func NewGormDB(sqlDB *sql.DB) (*gorm.DB, error) {
	return gorm.Open(postgres.New(postgres.Config{Conn: sqlDB}), &gorm.Config{})
}
