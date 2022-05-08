import "regenerator-runtime/runtime";
import React, { useState, useEffect } from "react";
import { login, logout } from "./utils";
import "./global.css";
import {
  Card,
  Col,
  Row,
  Button,
  notification,
  Modal,
  Form,
  Input,
  Table,
} from "antd";
import "antd/dist/antd.css";

import getConfig from "./config";
const { networkId } = getConfig(process.env.NODE_ENV || "development");

export default function App() {
  const [posts, setPosts] = useState([]);
  const [form] = Form.useForm();

  const [buttonDisabled, setButtonDisabled] = useState(true);

  const [showNotification, setShowNotification] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const [isModalVisibleDonate, setIsModalVisibleDonate] = useState(false);

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [loadingSubmitDonate, setLoadingSubmitDonate] = useState(false);

  const [postId, setPostId] = useState(null);

  const columns = [
    {
      title: "Người gửi",
      dataIndex: "donor",
      key: "donor",
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
    },
    {
      title: "Lời nhắn",
      dataIndex: "message",
      key: "message",
    },
  ];

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      const { title, body, amount } = values;
      setLoadingSubmit(true);
      window.contract
        .create_post({
          title,
          body,
          expect_amount: Number(amount),
        })
        .then((res) => {
          setLoadingSubmit(false);
          notification["success"]({
            message: "Thông báo",
            description: "Tạo bài thành công",
          });

          setIsModalVisible(false);
          window.contract
            .get_posts({ account_id: window.accountId })
            .then((post) => {
              setPosts(post);
            });
        })
        .catch((err) => {
          setLoadingSubmit(false);

          notification["error"]({
            message: "Thông báo",
            description: "Có lỗi xảy ra",
          });
        });
    });
    // setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const showModalDonate = (id) => {
    setIsModalVisibleDonate(true);
    setPostId(id);
  };

  const handleOkDonate = () => {
    form.validateFields().then((values) => {
      const { message, amount } = values;
      setLoadingSubmitDonate(true);
      window.contract
        .donate({
          post_id: postId,
          message,
          amount: Number(amount),
        })
        .then((res) => {
          setLoadingSubmitDonate(false);
          notification["success"]({
            message: "Thông báo",
            description: "Donate thành công",
          });

          setIsModalVisibleDonate(false);
          window.contract
            .get_posts({ account_id: window.accountId })
            .then((post) => {
              setPosts(post);
            });
        })
        .catch((err) => {
          setLoadingSubmitDonate(false);

          notification["error"]({
            message: "Thông báo",
            description: "Có lỗi xảy ra",
          });
        });
    });
    // setIsModalVisible(true);
  };

  const handleCancelDonate = () => {
    setIsModalVisibleDonate(false);
  };

  useEffect(() => {
    if (window.walletConnection.isSignedIn()) {
      window.contract
        .get_posts({ account_id: window.accountId })
        .then((post) => {
          setPosts(post);
        });
    }
  }, []);

  if (!window.walletConnection.isSignedIn()) {
    return (
      <main>
        <h1>Welcome to Near-Donate-app!</h1>
        <p>
          To make use of the NEAR blockchain, you need to sign in. The button
          below will sign you in using NEAR Wallet.
        </p>
        <p>
          By default, when your app runs in "development" mode, it connects to a
          test network ("testnet") wallet. This works just like the main network
          ("mainnet") wallet, but the NEAR Tokens on testnet aren't convertible
          to other currencies – they're just for testing!
        </p>
        <p>Go ahead and click the button below to try it out:</p>
        <p style={{ textAlign: "center", marginTop: "2.5em" }}>
          <button onClick={login}>Sign in</button>
        </p>
      </main>
    );
  }

  console.log(posts);

  return (
    // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
    <>
      <div className="site-card-wrapper">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Button style={{ float: "left" }} type="primary">
              Hello {window.accountId}
            </Button>
          </Col>
          <Col span={12}>
            <Button
              style={{ float: "right" }}
              onClick={logout}
              type="primary"
              danger
            >
              Sign out
            </Button>
            <Button
              style={{ float: "right", marginRight: "10px" }}
              onClick={showModal}
              type="primary"
            >
              Tạo bài nhận donate
            </Button>
          </Col>
          {!posts.length && "Chưa có bài ủng hộ nào"}
          {posts.map((post) => (
            <Col span={8} key={post.post_id}>
              <Card
                title={
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      {post.title} : {post.author}
                    </Col>
                    <Col span={12}>
                      {!(window.accountId == post.author) && (
                        <Button
                          onClick={() => showModalDonate(post?.post_id)}
                          type="primary"
                          style={{ float: "right" }}
                        >
                          Donate
                        </Button>
                      )}
                    </Col>
                  </Row>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col span={24}>Chi tiết: {post.body}</Col>
                  <Col span={24}>
                    <Table
                      columns={columns}
                      dataSource={post.donation_logs}
                      rowKey={"created_at"}
                      pagination={false}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
        {/* Modal Tạo bài */}

        <Modal
          title="Tạo bài"
          visible={isModalVisible}
          // onOk={handleOk}
          // onCancel={handleCancel}
          width={600}
          footer={[
            <Button
              key="submit"
              type="primary"
              onClick={handleOk}
              loading={loadingSubmit}
            >
              Submit
            </Button>,
            <Button key="submit" onClick={handleCancel}>
              Cancel
            </Button>,
          ]}
        >
          <Form
            name="basic"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            form={form}
          >
            <Form.Item
              label="Tiêu đề"
              name="title"
              rules={[{ required: true, message: "Please input your title!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Chi tiết"
              name="body"
              rules={[{ required: true, message: "Please input your body!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Số donate mong muốn"
              name="amount"
              rules={[{ required: true, message: "Please input your amount!" }]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
        {/* Modal DOnate */}
        <Modal
          title="Donate"
          visible={isModalVisibleDonate}
          // onOk={handleOk}
          // onCancel={handleCancel}
          width={600}
          footer={[
            <Button
              type="primary"
              onClick={handleOkDonate}
              loading={loadingSubmitDonate}
            >
              Submit
            </Button>,
            <Button key="submit" onClick={handleCancelDonate}>
              Cancel
            </Button>,
          ]}
        >
          <Form
            name="basic"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            form={form}
          >
            <Form.Item
              label="Tin nhắn"
              name="message"
              rules={[
                { required: true, message: "Please input your message!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Số tiền donate"
              name="amount"
              rules={[{ required: true, message: "Please input your amount!" }]}
            >
              <Input />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
}
