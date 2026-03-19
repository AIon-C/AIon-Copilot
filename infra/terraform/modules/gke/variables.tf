variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "cluster_name" {
  type    = string
  default = "aion-copilot-cluster"
}

variable "network_id" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "master_ipv4_cidr_block" {
  type    = string
  default = "172.16.0.0/28"
}

variable "deletion_protection" {
  type    = bool
  default = true
}
