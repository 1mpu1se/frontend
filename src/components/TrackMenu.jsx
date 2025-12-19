"use client";

import React, { useState } from "react";
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { MoreHorizontal } from "lucide-react";

export default function TrackMenu({ song, onAddToPlaylist, onDelete, onAbout, isAdmin = false }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleOpen = (e) => setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleDelete = () => { onDelete?.(song); handleClose(); };
    const handleAbout = () => { onAbout?.(song); handleClose(); };

    return (
        <>
            <IconButton size="small" onClick={handleOpen}>
                <MoreHorizontal size={20} color="#ffffff" />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                disableScrollLock
                slotProps={{
                    paper: {
                        sx: {
                            bgcolor: "#9b8ab1",
                            color: "#fff",
                            px: 2,
                            py: 1.1,
                            minWidth: 270,
                            boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
                            borderRadius: "14px",
                            "& .MuiMenuItem-root": {
                                color: "#ffffff",
                                paddingY: "4px",
                            },
                        },
                    },
                }}
            >
                {isAdmin && (
                    <Divider sx={{ borderColor: "#afa1c1", width: 170, mx: "auto", my: 0.1 }} />
                )}

                {isAdmin && (
                    <MenuItem onClick={handleDelete}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/music/track-menu/delete.svg" alt="Удалить" className="w-5.5 h-5.5" />
                        </ListItemIcon>
                        <ListItemText primary="Удалить" />
                    </MenuItem>
                )}

                {isAdmin && (
                    <Divider sx={{ borderColor: "#afa1c1", width: 170, mx: "auto", my: 0.1 }} />
                )}

                <MenuItem onClick={handleAbout}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/music/track-menu/info.svg" alt="О треке" className="w-5.5 h-5.5" />
                    </ListItemIcon>
                    <ListItemText primary="О треке" />
                </MenuItem>
            </Menu>
        </>
    );
}
