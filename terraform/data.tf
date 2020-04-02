data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "root_zone_id" {
  name = "/NHS/deductions-${data.aws_caller_identity.current.account_id}/root_zone_id"
}

data "aws_ssm_parameter" "private_zone_id" {
  name = "/NHS/deductions-${data.aws_caller_identity.current.account_id}/${var.environment}/private_root_zone_id"
}

data "aws_ssm_parameter" "authorization_keys" {
  name = "/NHS/${var.environment}-${data.aws_caller_identity.current.account_id}/${var.component_name}/authorization_keys"
}

data "aws_ssm_parameter" "gp2gp_authorization_keys" {
  name = "/NHS/${var.environment}-${data.aws_caller_identity.current.account_id}/gp2gp-adaptor/authorization_keys"
}

data "aws_ssm_parameter" "db-username" {
  name = "/nhs/${var.environment}/state-db/db-username"
}

data "aws_ssm_parameter" "db-password" {
  name = "/nhs/${var.environment}/state-db/db-password"
}

data "aws_ssm_parameter" "rds_endpoint" {
  name = "/NHS/${var.environment}-${data.aws_caller_identity.current.account_id}/private/rds_endpoint"
}

data "aws_ssm_parameter" "gp2gp_url" {
  name = "/NHS/${var.environment}-${data.aws_caller_identity.current.account_id}/gp2gp-adaptor/url"
}

data "aws_ssm_parameter" "deductions_private_ecs_cluster_id" {
  name = "/nhs/${var.environment}/deductions_private_ecs_cluster_id"
}

data "aws_ssm_parameter" "deductions_private_gp_to_repo_sg_id" {
  name = "/nhs/${var.environment}/deductions_private_gp_to_repo_sg_id"
}

data "aws_ssm_parameter" "deductions_private_private_subnets" {
  name = "/nhs/${var.environment}/deductions_private_private_subnets"
}

# data "aws_ssm_parameter" "deductions_private_alb_dns" {
#   name = "/nhs/${var.environment}/deductions_private_alb_dns"
# }

data "aws_ssm_parameter" "deductions_private_vpc_id" {
  name = "/nhs/${var.environment}/deductions_private_vpc_id"
}

# data "aws_ssm_parameter" "deductions_private_alb_arn" {
#   name = "/nhs/${var.environment}/deductions_private_alb_arn"
# }

# data "aws_ssm_parameter" "deductions_private_alb_httpl_arn" {
#   name = "/nhs/${var.environment}/deductions_private_alb_httpl_arn"
# }

# data "aws_ssm_parameter" "deductions_private_alb_httpsl_arn" {
#   name = "/nhs/${var.environment}/deductions_private_alb_httpsl_arn"
# }

data "aws_ssm_parameter" "deductions_private_int_alb_httpl_arn" {
  name = "/nhs/${var.environment}/deductions_private_int_alb_httpl_arn"
}

data "aws_ssm_parameter" "deductions_private_int_alb_httpsl_arn" {
  name = "/nhs/${var.environment}/deductions_private_int_alb_httpsl_arn"
}

data "aws_ssm_parameter" "deductions_private_alb_internal_dns" {
  name = "/nhs/${var.environment}/deductions_private_alb_internal_dns"
}
