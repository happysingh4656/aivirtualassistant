
provider "aws" {
  region = "us-east-1" # Change to your desired region
}

resource "aws_instance" "example" {
  ami           = "ami-0c55b159cbfafe1f0" # Replace with your desired AMI ID
  instance_type = "t2.medium"

  root_block_device {
    volume_size = 25
    volume_type = "gp3"
  }

  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo yum install -y java-11-amazon-corretto
              sudo yum install -y docker
              sudo systemctl enable docker
              sudo systemctl start docker
              sudo usermod -aG docker ec2-user
              sudo yum install -y wget
              
              # Install Jenkins
              wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat/jenkins.repo
              rpm --import https://pkg.jenkins.io/redhat/jenkins.io.key
              yum install -y jenkins
              systemctl enable jenkins
              systemctl start jenkins
              
              # Install SonarQube
              docker run -d --name sonarqube -p 9000:9000 sonarqube:lts
              
              # Install Trivy
              sudo rpm -ivh https://github.com/aquasecurity/trivy/releases/latest/download/trivy_0.50.0_Linux-64bit.rpm
              EOF

  tags = {
    Name = "Terraform-EC2"
  }
}