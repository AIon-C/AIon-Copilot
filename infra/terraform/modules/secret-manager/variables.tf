variable "project_id" {
  type = string
}

variable "secret_names" {
  type    = list(string)
  default = ["database-url", "jwt-secret", "gemini-api-key"]
}

variable "backend_secret_names" {
  type    = list(string)
  default = ["database-url", "jwt-secret"]
}

variable "ai_agent_secret_names" {
  type    = list(string)
  default = ["database-url", "jwt-secret", "gemini-api-key"]
}

variable "backend_sa_email" {
  type = string
}

variable "ai_agent_sa_email" {
  type = string
}
