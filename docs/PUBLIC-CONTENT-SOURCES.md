# Public homepage content and demo media

Reviewed November 2, 2026. All included imagery is stock demonstration content, not documentation of Podar Pathways, its students, or its premises. Keep a visible “Demo imagery” label until approved organization photographs and footage replace it. The campus image depicts Guggenheim Hall at the University of Washington, Seattle; do not identify it as a Podar campus.

## Downloaded demo assets

| Local file | Source and creator | Details |
| --- | --- | --- |
| `public/media/demo-student-collaboration.jpg` | [Vitaly Gariev / Unsplash](https://unsplash.com/photos/diverse-group-of-students-gathered-around-a-laptop-8gAbl776pc0) | Students gathered around a laptop. 202,252 bytes. |
| `public/media/demo-campus.jpg` | [Zoshua Colah / Unsplash](https://unsplash.com/photos/a-large-brick-university-building-at-dusk-MrH3_S3QMeE) | University of Washington building. 218,543 bytes. |
| `public/media/demo-campus-life.mp4` | [Keira Burton / Pexels](https://www.pexels.com/video/a-group-of-students-studying-6145947/) | Students studying on campus steps. 10 seconds, portrait 720 × 1280, 24 fps. 3,670,265 bytes. |
| `public/media/demo-campus-life-poster.jpg` | Same Pexels video | Matching preview. 266,198 bytes. |

The original source pages identify these assets as free to use. See the [Unsplash license](https://unsplash.com/license) and [Pexels license](https://www.pexels.com/license/). These allow website use; do not imply that the depicted people or institutions endorse this product. Credits are exported from `src/publicMedia.js`. All asset endpoints returned HTTP 200 and the expected image/jpeg or video/mp4 content type before download. Assets are self-hosted to avoid third-party image requests at page load.

Verified original download endpoints:

- `https://images.unsplash.com/photo-1758270705317-3ef6142d306f?auto=format&fit=crop&w=1600&q=80`
- `https://images.unsplash.com/photo-1741524601748-e234bdf4806e?auto=format&fit=crop&w=1200&q=80`
- `https://videos.pexels.com/video-files/6145947/6145947-hd_720_1280_24fps.mp4`
- `https://images.pexels.com/videos/6145947/pexels-photo-6145947.jpeg?auto=compress&w=1000`

## Factual content boundaries

Use the existing product name “Podar Pathways”. Repository references mix Podar branding, Sheth L.U.J./Sir M.V. College references, and example institutional email domains. These do not establish a verified legal organization identity or an affiliation with Podar Education Network. Avoid adding any such affiliation, address, institutional history, accreditation, partnerships, placement figures, student counts, guarantees, or testimonials without owner-supplied evidence. Use the application's centrally configured public `.com` contact address rather than copying legacy `.edu` examples.

Feature descriptions can be grounded in the existing routes and views: course catalog, learning roadmap, projects, credentials, opportunities, internships, placements, career passport, resume builder, and career coach. Describe their purpose rather than promising measured outcomes or validated scoring accuracy. AI coaching responses and sample resume statistics are not sources for public claims.

The [National Association of Colleges and Employers' official career readiness framework](https://www.naceweb.org/career-readiness/competencies/career-readiness-defined) supports general educational themes including career development, communication, critical thinking, professionalism, teamwork, and technology. This is background context, not an endorsement, certification, or proof of this platform's outcomes. No numerical or placement performance claims were derived from it.

## Replacing media

Replace the four files or update `PUBLIC_MEDIA` in `src/publicMedia.js`; keep the same named fields. Supply approved photos and a web-optimized MP4 with its matching poster. Update credits and remove demo labels only after the organization confirms ownership/usage permission and the images' relationship to the organization. The video should use controls, `preload="none"`, a poster, and no automatic sound.
