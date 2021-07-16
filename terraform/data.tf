data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "private_zone_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/private-root-zone-id"
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

data "aws_ssm_parameter" "deductions_private_private_subnets" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-private-private-subnets"
}

data "aws_ssm_parameter" "deductions_private_vpc_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/private-vpc-id"
}

data "aws_ssm_parameter" "nhs_number_prefix" {
  name = "/repo/${var.environment}/user-input/nhs-number-prefix"
}

data "aws_ssm_parameter" "deductions_private_db_subnets" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/deductions-private-database-subnets"
}
