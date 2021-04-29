locals {
  deductions_private_internal_alb_dns = data.aws_ssm_parameter.deductions_private_alb_internal_dns.value
  zone_id = data.aws_ssm_parameter.root_zone_id.value
  private_zone_id = data.aws_ssm_parameter.private_zone_id.value
}

data "aws_ssm_parameter" "environment_private_zone_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/environment-private-zone-id"
}

data "aws_ssm_parameter" "environment_public_zone_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/environment-public-zone-id"
}

data "aws_route53_zone" "environment_public_zone" {
  zone_id = data.aws_ssm_parameter.environment_public_zone_id.value
}

resource "aws_route53_record" "gp-to-repo" {
  zone_id = data.aws_ssm_parameter.environment_private_zone_id.value
  name    = var.dns_name
  type    = "CNAME"
  ttl     = "300"
  records = [local.deductions_private_internal_alb_dns]
}

resource "aws_acm_certificate" "gp-to-repo-cert" {
  domain_name       = "${var.dns_name}.${data.aws_route53_zone.environment_public_zone.name}"

  validation_method = "DNS"

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_route53_record" "gp-to-repo-cert-validation-record" {
  for_each = {
    for dvo in aws_acm_certificate.gp-to-repo-cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.environment_public_zone.zone_id
}

resource "aws_acm_certificate_validation" "gp-to-repo-cert-validation" {
  certificate_arn = aws_acm_certificate.gp-to-repo-cert.arn
  validation_record_fqdns = [for record in aws_route53_record.gp-to-repo-cert-validation-record : record.fqdn]
}

resource "aws_ssm_parameter" "service_url" {
  name  = "/repo/${var.environment}/output/${var.repo_name}/service-url"
  type  = "String"
  value = "https://${var.dns_name}.${var.environment}.non-prod.patient-deductions.nhs.uk"
}
