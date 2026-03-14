PROTO_SRC ?= proto/chatapp/auth/v1/auth_service.proto
OUT_DIR ?= services/auth

# how to use gen
# make gen PROTO_SRC=proto/chatapp/user/v1/user_service.proto OUT_DIR=services/user

gen:
    @protoc \
        --proto_path=proto \
        $(PROTO_SRC) \
        --go_out=$(OUT_DIR) \
        --go_opt=paths=source_relative \
        --go-grpc_out=$(OUT_DIR) \
        --go-grpc_opt=paths=source_relative