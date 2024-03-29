variable "region" {
  type    = string
  default = "eu-west-2"
}

variable "repo_name" {
  type = string
  default = "prm-deductions-gp-to-repo"
}

variable "environment" {}

variable "component_name" {}

variable "dns_name" {}

variable "task_image_tag" {}

variable "task_cpu" {}
variable "task_memory" {}
variable "port" {}

variable "service_desired_count" {}

variable "alb_deregistration_delay" {}

variable "database_name" {
  type = string
  default = "gptorepodb"
}

variable "application_database_user" {
  default = "application_user"
  description = "Needs to match with the user created in db-roles tf plan"
}

variable "log_level" {
type = string
default = "debug"
}

variable "env_url_suffix" {
  type = string
}

variable "grant_access_through_vpn" {}
variable "allow_vpn_to_ecs_tasks" { default=false }
variable "enable_rds_cluster_deletion_protection" {}

variable "db_instance_number" {
  default = 1
}