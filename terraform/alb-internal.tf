locals {
  domain = trimsuffix("${var.dns_name}.${data.aws_route53_zone.environment_public_zone.name}", ".")
}

resource "aws_alb" "alb-internal" {
  name            = "${var.environment}-${var.component_name}-alb-int"
  subnets         = local.private_subnets
  security_groups = [
    aws_security_group.gp_to_repo_alb.id,
    aws_security_group.alb_to_gp_to_repo_ecs.id,
    aws_security_group.service_to_gp_to_repo.id,
    aws_security_group.vpn_to_gp_to_repo.id,
    aws_security_group.gocd_to_gp_to_repo.id
  ]
  internal        = true
  drop_invalid_header_fields = true

  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

# Exists to be referred by the ECS task of gp to repo
resource "aws_security_group" "gp_to_repo_alb" {
  name        = "${var.environment}-alb-${var.component_name}"
  description = "gp-to-repo ALB security group"
  vpc_id      = data.aws_ssm_parameter.deductions_private_vpc_id.value

  tags = {
    Name = "${var.environment}-alb-${var.component_name}"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_alb_listener" "int-alb-listener-http" {
  load_balancer_arn = aws_alb.alb-internal.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Error"
      status_code  = "501"
    }
  }
}

resource "aws_alb_listener" "int-alb-listener-https" {
  load_balancer_arn = aws_alb.alb-internal.arn
  port              = "443"
  protocol          = "HTTPS"

  ssl_policy      = "ELBSecurityPolicy-TLS-1-2-Ext-2018-06"
  certificate_arn = aws_acm_certificate_validation.gp-to-repo-cert-validation.certificate_arn

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "text/plain"
      message_body = "Error"
      status_code  = "501"
    }
  }
}


resource "aws_alb_target_group" "internal-alb-tg" {
  name        = "${var.environment}-${var.component_name}-int-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = data.aws_ssm_parameter.deductions_private_vpc_id.value
  target_type = "ip"
  deregistration_delay = var.alb_deregistration_delay
  health_check {
    healthy_threshold   = 3
    unhealthy_threshold = 5
    timeout             = 5
    interval            = 10
    path                = "/health"
    port                = 3000
  }

  tags = {
    Environment = var.environment
    CreatedBy= var.repo_name
  }
}

resource "aws_alb_listener_rule" "int-alb-http-listener-rule" {
  listener_arn = aws_alb_listener.int-alb-listener-http.arn
  priority     = 200

  action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  condition {
    host_header {
      values = [local.domain]
    }
  }
}

resource "aws_alb_listener_rule" "int-alb-https-listener-rule" {
  listener_arn = aws_alb_listener.int-alb-listener-https.arn
  priority     = 201

  action {
    type             = "forward"
    target_group_arn = aws_alb_target_group.internal-alb-tg.arn
  }

  condition {
    host_header {
      values = [local.domain]
    }
  }
}

resource "aws_lb_listener_certificate" "gp-to-repo-int-listener-cert" {
  listener_arn    = aws_alb_listener.int-alb-listener-https.arn
  certificate_arn = aws_acm_certificate_validation.gp-to-repo-cert-validation.certificate_arn
}

resource "aws_security_group" "alb_to_gp_to_repo_ecs" {
  name        = "${var.environment}-alb-to-${var.component_name}-ecs"
  description = "Allows gp to repo ALB connections to gp-to-repo component task"
  vpc_id      = data.aws_ssm_parameter.deductions_private_vpc_id.value

  egress {
    description = "Allow outbound connections to gp-to-repo ECS Task"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    security_groups = [local.ecs_task_sg_id]
  }

  tags = {
    Name = "${var.environment}-alb-to-${var.component_name}-ecs"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_security_group" "service_to_gp_to_repo" {
  name        = "${var.environment}-service-to-${var.component_name}"
  description = "Controls access from repo services to gp-to-repo"
  vpc_id      = data.aws_ssm_parameter.deductions_private_vpc_id.value

  tags = {
    Name = "${var.environment}-service-to-${var.component_name}-sg"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_ssm_parameter" "service_to_gp_to_repo" {
  name = "/repo/${var.environment}/output/${var.repo_name}/service-to-gp-to-repo-sg-id"
  type = "String"
  value = aws_security_group.service_to_gp_to_repo.id
  tags = {
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_security_group" "vpn_to_gp_to_repo" {
  name        = "${var.environment}-vpn-to-${var.component_name}"
  description = "Controls access from vpn to gp-to-repo"
  vpc_id      = data.aws_ssm_parameter.deductions_private_vpc_id.value

  ingress {
    description = "Allow vpn to access gp-to-repo ALB"
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    security_groups = [data.aws_ssm_parameter.vpn_sg_id.value]
  }

  tags = {
    Name = "${var.environment}-vpn-to-${var.component_name}-sg"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

resource "aws_security_group" "gocd_to_gp_to_repo" {
  name        = "${var.environment}-gocd-to-${var.component_name}"
  description = "Controls access from gocd to gp-to-repo"
  vpc_id      = data.aws_ssm_parameter.deductions_private_vpc_id.value

  ingress {
    description = "Allow gocd to access gp-to-repo ALB"
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    security_groups = [data.aws_ssm_parameter.gocd_sg_id.value]
  }

  tags = {
    Name = "${var.environment}-gocd-to-${var.component_name}-sg"
    CreatedBy   = var.repo_name
    Environment = var.environment
  }
}

data "aws_ssm_parameter" "vpn_sg_id" {
  name = "/repo/${var.environment}/output/prm-deductions-infra/vpn-sg-id"
}

data "aws_ssm_parameter" "gocd_sg_id" {
  name = "/repo/${var.environment}/user-input/external/gocd-agent-sg-id"
}

resource "aws_cloudwatch_metric_alarm" "alb_http_errors" {
  alarm_name                = "${var.repo_name} 5xx errors"
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  evaluation_periods        = "1"
  metric_name               = "HTTPCode_Target_5XX_Count"
  namespace                 = "AWS/ApplicationELB"
  period                    = "60"
  statistic                 = "Average"
  threshold                 = "1"
  alarm_description         = "This metric monitors number of 5xx http status codes associated with ${var.repo_name}"
  treat_missing_data        = "notBreaching"
  dimensions                = {
    LoadBalancer = aws_alb.alb-internal.arn_suffix
  }
}