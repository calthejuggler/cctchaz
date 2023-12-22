// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Cursor;

use base64::Engine;
use image::{GrayImage, Rgb};
use imageproc::drawing::draw_hollow_rect_mut;
use imageproc::rect::Rect;
use rustface::{Detector, FaceInfo, ImageData};
use tauri::AppHandle;

fn detect_faces(detector: &mut dyn Detector, gray: &GrayImage) -> Vec<FaceInfo> {
    let (width, height) = gray.dimensions();
    let image = ImageData::new(gray, width, height);

    detector.detect(&image)
}

#[tauri::command]
fn receive_photo(app_handle: AppHandle,photo: String) -> String {
    let binding = match app_handle
        .path_resolver().resolve_resource("model/Seeta.bin") {
        Some(path) => path,
        None => return "https://i.stack.imgur.com/ngvBo.png".to_string()
    };
    let model_path = binding.to_str().unwrap();

    let mut detector = rustface::create_detector(model_path).unwrap();
    detector.set_min_face_size(20);
    detector.set_score_thresh(2.0);
    detector.set_pyramid_scale_factor(0.8);
    detector.set_slide_window_step(4, 4);

    let photo = photo.replace("data:image/png;base64,", "");
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(photo)
        .expect("error decoding base64");

    let base_image = image::load_from_memory(&bytes).unwrap();

    let mut rgb = base_image.to_rgb8();
    let faces = detect_faces(&mut *detector, &base_image.to_luma8());

    for face in faces {
        let bbox = face.bbox();
        let rect = Rect::at(bbox.x(), bbox.y()).of_size(bbox.width(), bbox.height());

        draw_hollow_rect_mut(&mut rgb, rect, Rgb([255, 0, 0]));
    }

    let mut buf: Vec<u8> = vec![];

    rgb.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png)
        .unwrap();

    format!(
        "data:image/png;base64,{}",
        base64::engine::general_purpose::STANDARD.encode(&buf)
    )
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![receive_photo])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
