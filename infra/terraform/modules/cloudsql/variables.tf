variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "instance_name" {
  type    = string
  default = "aion-copilot-db"
}

variable "network_id" {
  type = string
}

variable "private_vpc_connection" {
  type = any
}

variable "tier" {
  type    = string
  default = "db-custom-2-4096"
}

variable "availability_type" {
  type    = string
  default = "ZONAL"
}

variable "disk_size" {
  type    = number
  default = 20
}

variable "deletion_protection" {
  type    = bool
  default = true
}

variable "db_user" {
  type    = string
  default = "chatapp"
}

variable "db_password" {
  type      = string
  sensitive = true
}
