export interface BaseLine {
    filename: string;
    line: number;
    content: string;

    time?: string;
    pid?: number;
    tid?: number;
    level?: string;
    body?: string;
    originalIndex: number;

    getContent(): string;

    setContent(content: string): void;
}

export interface LogFile {
    // 原始文件，即用户从浏览器选择的文件句柄
    rawFile: File;

    // 文件路径，如果是压缩文件，这个路径是一个组合格式，"/a/b/c@/d/e/f.txt"
    path: string;

    size: number;

    status: "pending" | "extracting" | "extracted";

    isLogFile: boolean;

    // 日志行数
    lineCount?: number;
}

export interface User {
    id: number;
    nickname?: string;
    openid?: string;
    email?: string;
    avatar?: string;
    created_at?: string;
}

export interface Workspace {
    id: number;
    workspace_name: string;
    workspace_desc?: string;
    is_public: boolean;
    created_by: number;
    created_at: string;
    updated_at: string;
    _is_local?: boolean;
}

export interface WorkspaceUser {
    id: number;
    workspace_id: number;
    user_id: number;
    role: string;
    joined_at: string;
}

export interface Rule {
    id: number;
    uuid: string;
    workspace_id?: number;
    user_id: number;
    rule_type: 'filter' | 'color' | 'function';
    rule_name: string;
    rule_desc?: string;
    is_public: boolean;
    fg_color?: string;
    bg_color?: string;
    pattern?: string;
    replacement?: string;
    custom_function?: string;
    tags?: string;
    created_at: string;
    updated_at: string;
    _checked?: boolean;
    _is_editing?: boolean;
    _is_adding?: boolean;
}

export interface Favorite {
    id: number;
    user_id: number;
    rule_id: number;
    created_at: string;
}
