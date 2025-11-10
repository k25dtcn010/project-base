import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { Box, Button, Paper, Typography } from "@mui/material";
import { Alert, Checkbox, Form, Input } from "antd";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { authClient } from "@/lib/auth-client";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}


export const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm<LoginFormData>();

  const onSubmit = async (formData: LoginFormData) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (result.error) {
        // Handle better-auth error responses
        if (result.error.status === 401) {
          setErrorMessage(t("login.errors.invalidCredentials"));
        } else {
          setErrorMessage(result.error.message || t("login.errors.unknown"));
        }
      } else {
        // Successful login
        setErrorMessage(null);
        // Navigate to dashboard or home page
        navigate({ to: "/dashboard" });
      }
    } catch (error: any) {
      // Handle network or other errors
      if (
        error?.message?.includes("fetch") ||
        error?.message?.includes("network")
      ) {
        setErrorMessage(t("login.errors.networkError"));
      } else {
        setErrorMessage(error?.message || t("login.errors.unknown"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: "100%",
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{ mb: 3, fontWeight: 600 }}
        >
          {t("login.title")}
        </Typography>

        {errorMessage && (
          <Alert
            message={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={onSubmit}
          autoComplete="off"
          layout="vertical"
          initialValues={{
            email: "admin@example.com",
            password: "changethis",
            rememberMe: true,
          }}
        >
          <Form.Item
            name="email"
            label={t("login.email")}
            rules={[
              { required: true, message: t("login.errors.required") },
              {
                type: "email",
                message: t("login.errors.invalidEmail"),
              },
            ]}
          >
            <Input
              type="email"
              placeholder={t("login.email")}
              autoComplete="email"
              autoFocus
              disabled={isLoading}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={t("login.password")}
            rules={[{ required: true, message: t("login.errors.required") }]}
          >
            <Input.Password
              placeholder={t("login.password")}
              autoComplete="current-password"
              disabled={isLoading}
              size="large"
              iconRender={(visible) =>
                visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item name="rememberMe" valuePropName="checked">
            <Checkbox disabled={isLoading}>{t("login.rememberMe")}</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 1, mb: 2 }}
            >
              {isLoading ? t("login.loggingIn") : t("login.submit")}
            </Button>
          </Form.Item>

          <Box sx={{ textAlign: "center" }}>
            <a
              href="#"
              style={{
                color: "#1976d2",
                textDecoration: "none",
              }}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                // Navigate to password recovery page
                // navigate({ to: "/forgot-password" });
              }}
            >
              {t("login.forgotPassword")}
            </a>
          </Box>
        </Form>
      </Paper>
    </Box>
  );
};
