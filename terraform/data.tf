data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "private_zone_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/private-root-zone-id"
}

data "aws_ssm_parameter" "authorization_keys" {
  name = "/repo/${var.environment}/user-input/${var.component_name}-authorization-keys"
}

data "aws_ssm_parameter" "e2e_test_authorization_keys_for_gp_to_repo" {
  name = "/repo/${var.environment}/user-input/api-keys/${var.component_name}/e2e-test"
}

data "aws_ssm_parameter" "gp2gp_authorization_keys" {
  name = "/repo/${var.environment}/user-input/api-keys/gp2gp-adaptor/gp-to-repo"
}

data "aws_ssm_parameter" "ehr_repo_authorization_keys" {
  name = "/repo/${var.environment}/user-input/api-keys/ehr-repo/gp-to-repo"
}

data "aws_ssm_parameter" "db-username" {
  name = "/repo/${var.environment}/user-input/gp-to-repo-db-username"
}

data "aws_ssm_parameter" "db-password" {
  name = "/repo/${var.environment}/user-input/gp-to-repo-db-password"
}

data "aws_ssm_parameter" "rds_endpoint" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/gp-to-repo-rds-endpoint"
}

data "aws_ssm_parameter" "deductions_private_ecs_cluster_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-private-ecs-cluster-id"
}

data "aws_ssm_parameter" "deductions_private_gp_to_repo_sg_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-private-gp-to-repo-sg-id"
}

data "aws_ssm_parameter" "deductions_private_private_subnets" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-private-private-subnets"
}

data "aws_ssm_parameter" "deductions_private_vpc_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/private-vpc-id"
}

data "aws_ssm_parameter" "deductions_private_int_alb_httpl_arn" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-private-int-alb-httpl-arn"
}

data "aws_ssm_parameter" "deductions_private_int_alb_httpsl_arn" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-private-int-alb-httpsl-arn"
}

data "aws_ssm_parameter" "deductions_private_alb_internal_dns" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-private-alb-internal-dns"
}

data "aws_ssm_parameter" "nhs_number_prefix" {
  name = "/repo/${var.environment}/user-input/nhs-number-prefix"
}