variable "region" {
  type    = string
  default = "eu-west-2"
}

variable "repo_name" {
  type = string
  default = "prm-deductions-gp-to-repo"
}

variable "environment" {}

variable "ods_code" {
  description = "repository ods code"
}

variable "asid" {
  description = "repository asid"
}

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
}

variable "deductions_private_database_subnets" {
  type = list
}
